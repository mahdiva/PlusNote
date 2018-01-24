function renderGUI(){

    let $ = jQuery;

    $(document).ready(function(){

        let notebooks;
        let notes = [];
        let currentNotebook = '';
        let currentNote = '';

        let editorNotebook = '';
        let editorNote = '';

        // Render the text editor
        var editor = new Quill('.editor', {
            modules: {
                toolbar: [
                    [{ 'font': [] }, 'bold', 'italic', 'underline', 'strike', { 'size': [] }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['align', {'align': 'center'}, {'align': 'right'}, {'align': 'justify'}, { 'direction': 'rtl' }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['blockquote', 'code-block'],
                    ['image', 'link'],

                    ['clean'],
                ],
                syntax: {
                    highlight: text => hljs.highlightAuto(text).value
                },
            },
            theme: 'snow'
        });

        $('body').click(function(e){
            if($('.editor-container').find($(e.target)).length == 0){
                saveNote();
            }
        });

        // Save note content when Ctrl+S is pressed
        var keyboard = editor.getModule('keyboard');
        keyboard.addBinding({key: 'S', shortKey: true}, function(){
            saveNote();
        });

        // Tooltip for text editor buttons
        $.fn.tooltip = function(){
            var $tooltip = $('.tooltip');
            $tooltip.find('.tooltip-text').text( this.attr('data-title') );
            $tooltip.css('top', this.position().top + this.height() + 15 );
            $tooltip.css('left', this.position().left + (this.width()/2) + 5);
        };

        $('.ql-toolbar').prepend('<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-text"></div></div>');

        $('.tooltip').hide();

        $('.ql-toolbar button').attr('data-toggle', 'tooltip');
        $('.ql-toolbar .ql-color-picker').attr('data-toggle', 'tooltip');

        $('.ql-toolbar button.ql-bold').attr('data-title', 'Bold');
        $('.ql-toolbar button.ql-italic').attr('data-title', 'Italic');
        $('.ql-toolbar button.ql-underline').attr('data-title', 'Underline');
        $('.ql-toolbar button.ql-strike').attr('data-title', 'Strike');


        $('.ql-toolbar .ql-color-picker.ql-color').attr('data-title', 'Text color');
        $('.ql-toolbar .ql-color-picker.ql-background').attr('data-title', 'Background color');

        $('.ql-toolbar button.ql-align').attr('data-title', 'Left align');
        $('.ql-toolbar button.ql-align[value="center"]').attr('data-title', 'Center align');
        $('.ql-toolbar button.ql-align[value="right"]').attr('data-title', 'Right align');
        $('.ql-toolbar button.ql-align[value="justify"]').attr('data-title', 'Justify');
        $('.ql-toolbar button.ql-direction').attr('data-title', 'Right to left');

        $('.ql-toolbar button.ql-list[value="ordered"]').attr('data-title', 'Numbered list');
        $('.ql-toolbar button.ql-list[value="bullet"]').attr('data-title', 'Bulleted list');

        $('.ql-toolbar button.ql-indent[value="-1"]').attr('data-title', 'Decrease indent');
        $('.ql-toolbar button.ql-indent[value="+1"]').attr('data-title', 'Increase indent');


        $('.ql-toolbar button.ql-blockquote').attr('data-title', 'Quote');
        $('.ql-toolbar button.ql-code-block').attr('data-title', 'Code');


        $('.ql-toolbar button.ql-image').attr('data-title', 'Add image');
        $('.ql-toolbar button.ql-link').attr('data-title', 'Link');

        $('.ql-toolbar button.ql-clean').attr('data-title', 'Clear formatting');

        // Show tooltip when a toolbar item is hovered
        $('[data-toggle="tooltip"]').hover(function(){
            $(this).tooltip();
            $('.tooltip').fadeIn(200);
        }, function(){
            $('.tooltip').hide();
        });

        // Minimize sidebar
        $('.min-sidebar').on('click', function(){

            if($(this).attr('data-toggle') == "close"){

                $('.sidebar-menu>.sidebar-menu-list>li>a>span').fadeOut(100);

                $('.sidebar').animate({
                    width: '45px'
                }, { duration: 200, queue: false });

                $('.sidebar-menu-list .sidebar-sub-menu').slideUp(200);

                $('.main-container').animate({
                    marginLeft: '45px'
                }, { duration: 200, queue: false });

                $('.min-sidebar').html('<i class="fa fa-angle-double-right" aria-hidden="true"></i>');
                $('.min-sidebar').attr('data-toggle', 'expand');

            }else{

                $('.sidebar').animate({
                    width: '210px'
                }, { duration: 200, queue: false });

                $('.sidebar-menu-list .sidebar-sub-menu').slideDown(200);

                $('.main-container').animate({
                    marginLeft: '210px'
                }, 200, function(){
                    $('.sidebar-menu>.sidebar-menu-list>li>a>span').fadeIn(50);
                });

                $('.min-sidebar').html('<i class="fa fa-angle-double-left" aria-hidden="true"></i>');
                $('.min-sidebar').attr('data-toggle', 'close');

            }
        });

        // Settings menu
        $('.sidebar-menu-list li.settings').on('click', function(){
            $('.popup-container-settings').fadeIn(200);
        });

        $('.popup-container-settings .btn-cancel').on('click', function(){
            $('.popup-container-settings').fadeOut(200);
        });

        $('.settings-window>header .tab-settings').on('click', function(){
            $('.settings-window>header span').removeClass('selected');
            $(this).addClass('selected');
            $('.about-page').hide();
            $('.settings-page').show();
        });

        $('.popup-window-buttons .btn-save').on('click', function(){
            let theme = $('.setting-item input:checked').val();
            let codeTheme =  $('.setting-item select').find(':selected').val();
            saveSettings(theme, codeTheme);
            loadSettings();
            $('.popup-container-settings').fadeOut(200);
        });

        $('.settings-window>header .tab-about').on('click', function(){
            $('.settings-window>header span').removeClass('selected');
            $(this).addClass('selected');
            $('.settings-page').hide();
            $('.about-page').show();
        });


        // Load the theme
        function loadSettings(){
            let settings = getSettings();

            if(settings.theme == 'dark'){
                let styles = `<style class="theme-style">.main-container,.notes-sidebar{background-color: #30363d} .sidebar{background-color: #23241f} .note-item.selected{background-color: #354b5e}.ql-fill{fill: #ffffff !important} .ql-stroke{stroke: #ffffff !important} .notes-sidebar,.main-container,.add-note,.delete-note, .export-note{color: #ffffff !important}</style>`;
                $('html>head').append(styles);
            }else{
                $('style.theme-style').remove();
            }

            let path = 'css/themes/';

            switch(settings.codeTheme){
                case 'monokai': path += 'monokai-sublime.css';
                break;
                case 'vs2015': path += 'vs2015.css';
                break;
                case 'solarized-light': path += 'solarized-light.css';
                break;
                case 'solarized-dark': path += 'solarized-dark.css';
                break;
                case 'dracula': path += 'dracula.css';
                break;
                default: path += 'monokai-sublime.css';
                break;
            }

            $('.codeTheme').remove();
            let codeTheme = `<link rel="stylesheet" href="${path}" class="codeTheme">`;
            $('html>head').append(codeTheme);

        }

        // Load notebooks into the sidebar
        function loadNotebooks(){
            notebooks = getNotebooks();
            $('.sidebar-menu-list.sidebar-sub-menu').html("");
            $.each(notebooks, function(id, notebook) {
                $('.sidebar-menu-list.sidebar-sub-menu').prepend(`<li><a href="#" data-id="${id}">${notebook.title}</a></li>`);
            });
        }

        // Function for opening a notebook and displaying its notes
        function openNotebook($item){
            $('.notes-sidebar .notes-sidebar-title h3').html( $item.text() + '<a href="#" class="delete-notebook"><i class="fa fa-trash-alt"></i></a>');
            $('.sidebar-menu .sidebar-sub-menu li').removeClass('selected');
            $item.addClass('selected');

            currentNotebook = $item.find('a').attr('data-id');
            loadNotes(currentNotebook);
        }

        // Load notes when a notebook is clicked
        $(document).on('click', '.sidebar-menu .sidebar-sub-menu li', function(){
            openNotebook($(this));
        });

        // Creating notebook
        $('.add-notebook').on('click', function(){
            $('.popup-container').fadeIn(200);
        });

        $('.popup-window-buttons .btn-cancel').on('click', function(){
            $('.popup-container').fadeOut(200);
        });

        $('.popup-window-buttons .btn-create').on('click', function(){

            let notebookTitle = $('.popup-container .notebook-title-textbox input').val();
            addNotebook(notebookTitle);
            loadNotebooks();
            $('.popup-container .notebook-title-textbox input').val("");
            $('.popup-container').css('display', 'none');

            openNotebook($('.sidebar-menu .sidebar-sub-menu li').eq(0));
        });

        // Deleting a notebook
        $(document).on('click', '.notes-sidebar-title .delete-notebook', function(){
            if($('.sidebar-menu .sidebar-sub-menu li').length > 1){
                deleteNotebook(currentNotebook);
                loadNotebooks();
                openNotebook($('.sidebar-menu .sidebar-sub-menu li').eq(0))
            }
        });

        // Load notes
        function loadNotes(notebookID){
            $('.notes-list-container').html('');
            notes = getNotes(notebookID);

            $.each(notes, function(i, note) {

                let item = `<div class="note-item" data-id="${note.id}">
                                <div class="note-item-title">
                                    <h4>${note.title}</h4>
                                    <div class="note-item-action">
                                        <a href="#" class="add-fav" ${ (note.favourite) ? 'style="color: #ef503b;"' : ''}><i class="fa${ (note.favourite) ? '' : 'r'} fa-heart"></i></a>
                                        <a href="#" class="delete-note"><i class="far fa-trash-alt"></i></a>
                                        <a href="#" class="export-note"><i class="fas fa-download"></i></a>
                                    </div>
                                </div>
                                <div class="note-item-date">
                                    ${getNoteTime(note.created)}
                                </div>
                            </div>`;

                $('.notes-list-container').prepend(item);

            });

            if(notes.length > 0){
                openNote($('.notes-list-container .note-item').eq(0), notebookID);
            }
        }

        // Save the open note
        function saveNote(){
            if($('.notes-list-container').children('.note-item').length > 0){
                let content = editor.getContents();
                editNoteContent(editorNotebook, editorNote, editor.getContents());
                $('.notes-list-container .note-item.selected .note-item-title h4').text((content.ops[0].insert.length > 18) ? content.ops[0].insert.substr(0, 18) + "..." : content.ops[0].insert);
            }
        }

        // Adding a new note to the notebook
        $('.add-note').on('click', function(){
            let defaultContent = {"ops":[{"attributes":{"size":"large","bold":true},"insert":"Untitled"},{"insert":"\n\n\n"}]};
            addNote(currentNotebook, 'Untitled', defaultContent);
            loadNotes(currentNotebook);
        });

        // Deleting a note
        $('.notes-list-container').on('click', '.delete-note', function(){
            deleteNote(currentNotebook, $(this).closest('.note-item').attr('data-id'));
            $(this).closest('.note-item').remove();

        });

        // Function for opening a note in the text editor
        function openNote($item, notebook){
            if($item.closest('.note-item').attr('data-notebook')){
                notebook = $item.closest('.note-item').attr('data-notebook');
            }
            let noteContent = getContent(notebook, $item.attr('data-id'));
            $('.notes-list-container .note-item').removeClass('selected');
            $item.addClass('selected');
            editorNotebook = notebook;
            editorNote = $item.attr('data-id');
            editor.setContents(noteContent);
        }

        // Note clicked
        $(document).on('click', '.note-item', function(){
            openNote($(this), currentNotebook);
        });

        // Search in the note list
        $('.search-container input').on('keyup', function(){
            let keyword = $(this).val().toLowerCase();
            $('.notes-list-container .note-item').each(function(){
                let title = $('.note-item-title h4', this).text().toLowerCase();
                if(title.indexOf(keyword) == -1){
                    $(this).hide();
                }else{
                    $(this).show();
                }
            });
        });

        $('.sidebar-menu-list li').on('click', function(){
            $('.sidebar-menu-list li').removeClass('selected');
            $(this).addClass('selected');
        });

        // Load favourite notes
        function loadFavourites(){
            $('.notes-list-container').html('');
            notes = getFavourites();

            $.each(notes, function(i, note) {

                let item = `<div class="note-item" data-id="${note[1].id}" data-notebook="${note[0]}">
                                <div class="note-item-title">
                                    <h4>${note[1].title}</h4>
                                    <div class="note-item-action">
                                        <a href="#" class="add-fav" ${ (note[1].favourite) ? 'style="color: #ef503b;"' : ''}><i class="fa${ (note[1].favourite) ? '' : 'r'} fa-heart"></i></a>
                                    </div>
                                </div>
                                <div class="note-item-date">
                                    ${getNoteTime(note[1].created)}
                                </div>
                            </div>`;

                $('.notes-list-container').prepend(item);

            });

            if(notes.length > 0){
                openNote($('.notes-list-container .note-item').eq(0), $('.notes-list-container .note-item').eq(0).attr('data-notebook'));
            }
        }

        // Add to favourites
        $(document).on('click', '.note-item-action a.add-fav', function(){
            if($(this).closest('.note-item').attr('data-notebook')){
                toggleFavourites($(this).closest('.note-item').attr('data-notebook'), $(this).closest('.note-item').attr('data-id'));
                loadFavourites();
            }else{
                toggleFavourites(currentNotebook, $(this).closest('.note-item').attr('data-id'));
                loadNotes(currentNotebook);
            }
        });

        $('.sidebar-menu-list .favourites').on('click', function(){
            $('.notes-sidebar .notes-sidebar-title h3').html('Favourites');
            $('.add-note').hide();
            loadFavourites();
        });

        $('.sidebar-menu-list li.notebooks').on('click', function(){
            $('.add-note').show();
            openNotebook($('.sidebar-menu .sidebar-sub-menu li').eq(0));
        });

        $(document).on('click', '.note-item-action a.export-note', function(){
            let nb;
            let $item = $(this).closest('.note-item');
            if($item.attr('data-notebook')){
                nb = $item.attr('data-notebook');
            }else{
                nb = currentNotebook;
            }
            openNote($item, nb);

            exportPdf(editor.root.innerHTML);
        });


        // Load and apply preferences
        loadSettings();

        // Load and display the notebooks
        loadNotebooks();
        // Open the first notebook by default
        openNotebook($('.sidebar-menu .sidebar-sub-menu li').eq(0));

        window.getEditorContent = function(){
            console.log(editor.getContents());
        }

    });

}

module.exports = {renderGUI};
